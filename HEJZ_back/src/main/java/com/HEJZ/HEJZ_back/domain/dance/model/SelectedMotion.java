package com.HEJZ.HEJZ_back.domain.dance.model;

import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Id;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@NoArgsConstructor
@Entity
@Getter
@Setter
public class SelectedMotion {

    @Id
    @GeneratedValue
    private Long id;

    private String motionId;

    @ManyToOne
    @JoinColumn(name = "selection_group_id")
    private LyricsSelectionGroup selectionGroup;
}